package com.securebank.security;

import com.securebank.customer.entity.Customer;
import com.securebank.customer.repository.CustomerRepository;
import com.securebank.user.entity.User;
import com.securebank.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public UserDetailsServiceImpl(UserRepository userRepository, CustomerRepository customerRepository) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Try searching by username first
        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail);

        // If not found, try searching by customer email
        if (userOpt.isEmpty()) {
            Optional<Customer> customerOpt = customerRepository.findByEmail(usernameOrEmail);
            if (customerOpt.isPresent()) {
                userOpt = Optional.of(customerOpt.get().getUser());
            }
        }

        User user = userOpt.orElseThrow(() ->
                new UsernameNotFoundException("User not found with username or email: " + usernameOrEmail)
        );

        return UserPrincipal.create(user);
    }
}
